import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { useWorkspaceStore } from '../../store/workspace'
import { useTheme } from '../../context/ThemeContext'
import { workspacesApi } from '../../api/workspaces'
import { connectionsApi } from '../../api/connections'

export default function Sidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  const { workspaces, currentId, setWorkspaces, setCurrentId, addWorkspace } = useWorkspaceStore()

  const [showDropdown, setShowDropdown] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [form, setForm] = useState({ name: '', base_url: '', api_key: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    workspacesApi.list().then((ws) => {
      setWorkspaces(ws)
      if (ws.length > 0 && (!currentId || !ws.find((w) => w.id === currentId))) {
        setCurrentId(ws[0].id)
      }
    })
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = workspaces.find((w) => w.id === currentId)

  const openCreateModal = () => {
    setShowDropdown(false)
    setForm({ name: '', base_url: '', api_key: '' })
    setCreateError('')
    setShowCreateModal(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      const ws = await workspacesApi.create(form.name.trim())
      await connectionsApi.create(ws.id, {
        name: form.name.trim(),
        base_url: form.base_url.trim(),
        api_key: form.api_key,
      })
      addWorkspace(ws)
      setCurrentId(ws.id)
      setShowCreateModal(false)
    } catch {
      setCreateError('Failed to create workspace. Check your n8n URL and API key.')
    } finally {
      setCreating(false)
    }
  }

  const initial = (user?.name || user?.email || '?')[0].toUpperCase()

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-3 py-2 text-sm font-medium transition-colors w-full rounded-md ${
      isActive
        ? 'bg-accent/10 text-accent'
        : 'text-text-muted hover:text-text hover:bg-surface-raised'
    }`

  return (
    <>
      <aside className="w-52 bg-surface border-r border-border flex flex-col shrink-0">

        {/* Brand */}
        <div className="px-4 pt-5 pb-4 shrink-0">
          <span className="text-sm font-bold tracking-tight text-text">NodePad</span>
        </div>

        {/* Workspace switcher */}
        <div className="px-3 pb-3 shrink-0 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 border border-border bg-surface-raised text-sm font-medium text-text hover:border-border-strong transition-colors rounded-md"
          >
            <span className="truncate">{current?.name ?? 'Select workspace'}</span>
            <span className="text-text-muted text-[10px] ml-2 shrink-0">{showDropdown ? '▲' : '▼'}</span>
          </button>

          {showDropdown && (
            <div className="absolute left-3 right-3 top-full z-50 card py-1 mt-1 shadow-xl">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => { setCurrentId(ws.id); setShowDropdown(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-surface-raised rounded-md mx-0.5 ${
                    ws.id === currentId ? 'text-accent font-medium' : 'text-text'
                  }`}
                >
                  <span className="text-[10px] w-3 shrink-0 text-accent">{ws.id === currentId ? '✓' : ''}</span>
                  <span className="truncate">{ws.name}</span>
                </button>
              ))}

              <div className="border-t border-border my-1 mx-1" />

              <button
                onClick={openCreateModal}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text hover:bg-surface-raised transition-colors text-left rounded-md mx-0.5"
              >
                <span className="text-xs font-bold">+</span>
                <span>New workspace</span>
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border mx-3 mb-2 shrink-0" />

        {/* Main nav */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          <NavLink to="/workflows" className={navItemClass}>Workflows</NavLink>
        </nav>

        {/* Settings pinned above user profile */}
        <div className="px-2 pb-1 shrink-0">
          <NavLink to="/settings" className={navItemClass}>Settings</NavLink>
        </div>

        {/* User profile */}
        <div className="border-t border-border mx-3 mt-1 shrink-0" />
        <div className="p-3 shrink-0 space-y-2">
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-text truncate leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] text-text-muted truncate leading-tight">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="text-xs text-text-muted hover:text-text transition-colors"
            >
              Sign out
            </button>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
              className="w-6 h-6 flex items-center justify-center rounded-md bg-surface-raised text-text-muted hover:text-text hover:bg-border transition-colors text-xs"
            >
              {theme === 'dark' ? '☀' : '◑'}
            </button>
          </div>
        </div>
      </aside>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-text mb-1">New Workspace</h2>
            <p className="text-xs text-text-muted mb-5">Each workspace connects to one n8n instance.</p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Workspace name</label>
                <input
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. My Company"
                  className="input w-full px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="border-t border-border pt-4 space-y-3">
                <p className="text-xs font-medium text-text-muted">n8n Connection</p>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">Base URL</label>
                  <input
                    value={form.base_url}
                    onChange={(e) => setForm((p) => ({ ...p, base_url: e.target.value }))}
                    placeholder="https://n8n.yourcompany.com"
                    className="input w-full px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={form.api_key}
                    onChange={(e) => setForm((p) => ({ ...p, api_key: e.target.value }))}
                    placeholder="Your n8n API key"
                    className="input w-full px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              {createError && <p className="text-xs text-red-400">{createError}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm border border-border bg-surface-raised text-text rounded-md hover:border-border-strong transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm bg-accent text-white rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
