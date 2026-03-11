import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { useAuthStore } from '../store/auth'
import { useTheme } from '../context/ThemeContext'
import { useWorkspaceStore } from '../store/workspace'
import { workspacesApi } from '../api/workspaces'
import { connectionsApi } from '../api/connections'
import type { Connection } from '../types'

type Tab = 'account' | 'workspace'

// ── Shared primitives ─────────────────────────────────────────────────────────

function Section({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">{title}</h2>
        {badge}
      </div>
      <div className="card p-5 space-y-4">{children}</div>
    </div>
  )
}

function Row({ label, sub, children }: { label: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text">{label}</p>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-border" />
}

function Feedback({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className={`text-xs font-medium ${ok ? 'text-green-400' : 'text-red-400'}`}>
      {ok ? '✓' : '✗'} {text}
    </p>
  )
}

// ── Account tab ───────────────────────────────────────────────────────────────

function AccountTab() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [claudeKey, setClaudeKey] = useState(localStorage.getItem('claude_api_key') || '')
  const [keySaved, setKeySaved] = useState(false)

  const saveClaudeKey = () => {
    if (claudeKey.trim()) localStorage.setItem('claude_api_key', claudeKey.trim())
    else localStorage.removeItem('claude_api_key')
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  const maskedKey = () => {
    const k = localStorage.getItem('claude_api_key')
    return k ? `sk-ant-···${k.slice(-6)}` : null
  }

  return (
    <div className="space-y-6">

      <Section title="Profile">
        <Row label="Name">
          <span className="text-sm text-text-muted">{user?.name || '—'}</span>
        </Row>
        <Divider />
        <Row label="Email">
          <span className="text-sm text-text-muted">{user?.email || '—'}</span>
        </Row>
      </Section>

      <Section title="Appearance">
        <Row label="Theme" sub={theme === 'dark' ? 'Currently using dark mode' : 'Currently using light mode'}>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 border border-border bg-surface-raised text-sm font-medium hover:border-border-strong rounded-md transition-colors"
          >
            <span>{theme === 'dark' ? '☀' : '◑'}</span>
            <span>Switch to {theme === 'dark' ? 'light' : 'dark'}</span>
          </button>
        </Row>
      </Section>

      <Section title="AI Assistant">
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">
              Claude API Key
              <span className="ml-1 font-normal opacity-70">(stored in your browser only)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                placeholder="sk-ant-..."
                className="input flex-1 px-3 py-2 text-sm"
              />
              <button
                onClick={saveClaudeKey}
                className="px-3 py-2 text-xs border border-border bg-surface-raised text-text rounded-md hover:border-border-strong transition-colors shrink-0"
              >
                {keySaved ? '✓ Saved' : 'Save'}
              </button>
            </div>
          </div>
          {maskedKey() && (
            <p className="text-[10px] text-text-muted font-mono bg-bg px-3 py-1.5 rounded border border-border">
              {maskedKey()}
            </p>
          )}
        </div>
      </Section>

      <Section title="Account">
        <Row label="Sign out" sub="You'll need to log in again to access your workspaces.">
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-colors"
          >
            Sign out
          </button>
        </Row>
      </Section>

    </div>
  )
}

// ── Workspace tab ─────────────────────────────────────────────────────────────

function WorkspaceTab() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currentId, workspaces, setWorkspaces, setCurrentId } = useWorkspaceStore()
  const workspace = workspaces.find((w) => w.id === currentId)

  const [connection, setConnection] = useState<Connection | null>(null)
  const [fetching, setFetching] = useState(true)

  const [wsName, setWsName] = useState(workspace?.name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [connUrl, setConnUrl] = useState('')
  const [connKey, setConnKey] = useState('')
  const [savingConn, setSavingConn] = useState(false)
  const [connMsg, setConnMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [testing, setTesting] = useState(false)

  const load = useCallback(async () => {
    if (!currentId) return
    setFetching(true)
    try {
      const conns = await connectionsApi.list(currentId)
      const conn = conns[0] ?? null
      setConnection(conn)
      if (conn) setConnUrl(conn.base_url)
    } finally {
      setFetching(false)
    }
  }, [currentId])

  useEffect(() => {
    setWsName(workspace?.name ?? '')
    setNameMsg(null)
    setConnMsg(null)
    load()
  }, [load])

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentId || !wsName.trim()) return
    setSavingName(true)
    setNameMsg(null)
    try {
      const updated = await workspacesApi.update(currentId, { name: wsName.trim() })
      setWorkspaces(workspaces.map((w) => (w.id === currentId ? updated : w)))
      setNameMsg({ ok: true, text: 'Workspace renamed.' })
    } catch {
      setNameMsg({ ok: false, text: 'Failed to save.' })
    } finally {
      setSavingName(false)
    }
  }

  const testConnection = async () => {
    if (!connection) return
    setTesting(true)
    setConnMsg(null)
    try {
      const res = await connectionsApi.test(connection.id)
      setConnMsg({ ok: res.success, text: res.success ? 'Connected successfully.' : (res.error ?? 'Failed.') })
    } catch {
      setConnMsg({ ok: false, text: 'Connection failed.' })
    } finally {
      setTesting(false)
    }
  }

  const saveConnection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!connection) return
    setSavingConn(true)
    setConnMsg(null)
    try {
      const payload: { base_url?: string; api_key?: string } = { base_url: connUrl.trim() }
      if (connKey) payload.api_key = connKey
      const updated = await connectionsApi.update(connection.id, payload)
      setConnection(updated)
      setConnKey('')
      setConnMsg({ ok: true, text: 'Connection updated.' })
    } catch {
      setConnMsg({ ok: false, text: 'Failed to save.' })
    } finally {
      setSavingConn(false)
    }
  }

  const deleteWorkspace = async () => {
    if (!currentId || !workspace) return
    const confirmed = window.confirm(
      `Delete "${workspace.name}"? This removes all connections and cannot be undone.`
    )
    if (!confirmed) return
    try {
      await workspacesApi.delete(currentId)
      const remaining = workspaces.filter((w) => w.id !== currentId)
      setWorkspaces(remaining)
      setCurrentId(remaining[0]?.id ?? (null as any))
      navigate('/workflows')
    } catch {
      alert('Failed to delete workspace.')
    }
  }

  if (!currentId) {
    return (
      <div className="text-center py-16">
        <p className="text-3xl mb-3 opacity-30">⬡</p>
        <p className="text-sm font-semibold text-text mb-1">No workspace selected</p>
        <p className="text-xs text-text-muted">Switch to a workspace using the sidebar.</p>
      </div>
    )
  }

  if (fetching) return <p className="text-text-muted text-sm">Loading...</p>

  return (
    <div className="space-y-6">

      {/* General */}
      <Section title="General">
        <form onSubmit={saveName}>
          <label className="block text-xs text-text-muted mb-1.5">Workspace name</label>
          <div className="flex gap-2">
            <input
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              className="input flex-1 px-3 py-2 text-sm"
              required
            />
            <button
              type="submit"
              disabled={savingName || wsName.trim() === workspace?.name}
              className="px-4 py-2 text-sm bg-accent text-white rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50 shrink-0"
            >
              {savingName ? 'Saving…' : 'Save'}
            </button>
          </div>
          {nameMsg && <div className="mt-2"><Feedback ok={nameMsg.ok} text={nameMsg.text} /></div>}
        </form>
      </Section>

      {/* n8n Connection */}
      <Section title="n8n Connection">
        {!connection ? (
          <p className="text-sm text-text-muted">No connection configured yet.</p>
        ) : (
          <form onSubmit={saveConnection} className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Base URL</label>
              <input
                value={connUrl}
                onChange={(e) => setConnUrl(e.target.value)}
                placeholder="https://n8n.yourcompany.com"
                className="input w-full px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">
                API Key
                <span className="ml-1 font-normal opacity-70">(leave blank to keep existing)</span>
              </label>
              <input
                type="password"
                value={connKey}
                onChange={(e) => setConnKey(e.target.value)}
                placeholder="sk-…"
                className="input w-full px-3 py-2 text-sm"
              />
            </div>
            {connMsg && <Feedback ok={connMsg.ok} text={connMsg.text} />}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={testConnection}
                disabled={testing}
                className="px-3 py-1.5 text-xs border border-border bg-surface-raised text-text rounded-md hover:border-border-strong transition-colors disabled:opacity-50"
              >
                {testing ? 'Testing…' : 'Test Connection'}
              </button>
              <button
                type="submit"
                disabled={savingConn}
                className="px-3 py-1.5 text-xs bg-accent text-white rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {savingConn ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Section>

      {/* Members */}
      <Section
        title="Members"
        badge={<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">SOON</span>}
      >
        <Row label={user?.name || 'You'} sub={user?.email}>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-raised text-text-muted font-medium">Owner</span>
        </Row>
        <Divider />
        <div>
          <label className="block text-xs text-text-muted mb-2">Invite by email</label>
          <div className="flex gap-2 opacity-40 cursor-not-allowed select-none">
            <input disabled placeholder="colleague@company.com" className="input flex-1 px-3 py-2 text-sm" />
            <button disabled className="px-3 py-2 text-xs bg-accent text-white rounded-md shrink-0">
              Invite
            </button>
          </div>
          <p className="text-xs text-text-muted mt-2">Team collaboration is on the roadmap.</p>
        </div>
      </Section>

      {/* Danger Zone */}
      <Section title="Danger Zone">
        <Row label="Delete this workspace" sub="Removes all connections. Cannot be undone.">
          <button
            onClick={deleteWorkspace}
            className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-colors"
          >
            Delete
          </button>
        </Row>
      </Section>

    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'account',   label: 'Account'   },
  { id: 'workspace', label: 'Workspace' },
]

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') ?? 'account') as Tab

  const setTab = (t: Tab) => setSearchParams(t === 'account' ? {} : { tab: t }, { replace: true })

  return (
    <AppLayout>
      {/* Page header + tabs */}
      <div className="border-b border-border bg-surface px-6 pt-4 shrink-0">
        <h1 className="text-sm font-semibold text-text mb-4">Settings</h1>
        <div className="flex gap-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-1.5 text-sm font-medium rounded-t-md transition-colors ${
                tab === id
                  ? 'bg-accent/10 text-accent border-b-2 border-accent'
                  : 'text-text-muted hover:text-text hover:bg-surface-raised'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-lg">
          {tab === 'account' ? <AccountTab /> : <WorkspaceTab />}
        </div>
      </div>
    </AppLayout>
  )
}
