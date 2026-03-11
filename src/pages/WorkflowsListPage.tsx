import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'
import { useWorkspaceStore } from '../store/workspace'
import { connectionsApi } from '../api/connections'
import { workflowsApi } from '../api/workflows'
import type { Connection, Workflow } from '../types'

export default function WorkflowsListPage() {
  const navigate = useNavigate()
  const { currentId } = useWorkspaceStore()

  const [connection, setConnection] = useState<Connection | null>(null)
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!currentId) return
    setFetching(true)
    setError('')
    try {
      const conns = await connectionsApi.list(currentId)
      const conn = conns[0] ?? null
      setConnection(conn)
      if (!conn) { setWorkflows([]); return }
      const wfs = await workflowsApi.list(conn.id)
      setWorkflows(wfs)
    } catch {
      setError('Failed to load workflows. Check your connection in Settings → Workspace.')
    } finally {
      setFetching(false)
    }
  }, [currentId])

  useEffect(() => { load() }, [load])

  const active = workflows.filter((w) => w.active).length

  return (
    <AppLayout>
      {/* Page header */}
      <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-text">Workflows</h1>
          {!fetching && connection && workflows.length > 0 && (
            <p className="text-xs text-text-muted mt-0.5">
              {workflows.length} total · {active} active
              <span className="ml-2 opacity-50">· {connection.base_url}</span>
            </p>
          )}
        </div>
        {connection && (
          <Button variant="secondary" onClick={load} className="text-xs h-8 px-3">
            ↻ Sync
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {!currentId ? (
          <Empty
            icon="⬡"
            title="No workspace selected"
            sub="Use the workspace switcher in the sidebar to select or create one."
          />
        ) : fetching ? (
          <SkeletonGrid />
        ) : error ? (
          <div className="card border-red-500/20 p-5 max-w-lg">
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <button
              onClick={() => navigate('/settings?tab=workspace')}
              className="text-xs text-accent hover:underline"
            >
              Go to Workspace Settings →
            </button>
          </div>
        ) : !connection ? (
          <Empty
            icon="⛓"
            title="No n8n connection yet"
            sub="Connect your n8n instance to start browsing workflows."
            action={
              <Button onClick={() => navigate('/settings?tab=workspace')}>
                Open Workspace Settings →
              </Button>
            }
          />
        ) : workflows.length === 0 ? (
          <Empty
            icon="⚡"
            title="No workflows found"
            sub="Your n8n instance is connected but has no workflows, or try syncing."
            action={<Button variant="secondary" onClick={load}>↻ Sync</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-w-5xl">
            {workflows.map((wf) => (
              <WorkflowCard
                key={wf.id}
                workflow={wf}
                onClick={() => navigate(`/workflows/${wf.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WorkflowCard({ workflow: wf, onClick }: { workflow: Workflow; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="card p-4 text-left w-full hover:border-border-strong hover:bg-surface-raised transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="font-medium text-sm text-text leading-snug">{wf.name}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
          wf.active
            ? 'bg-green-500/15 text-green-400'
            : 'bg-surface-raised text-text-muted'
        }`}>
          {wf.active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <p className="text-[10px] text-text-muted font-mono">ID {wf.n8n_workflow_id}</p>
    </button>
  )
}

function Empty({ icon, title, sub, action }: { icon: string; title: string; sub: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-24">
      <p className="text-3xl mb-4 opacity-40">{icon}</p>
      <p className="text-sm font-semibold text-text mb-1">{title}</p>
      <p className="text-xs text-text-muted mb-6 max-w-xs mx-auto">{sub}</p>
      {action}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-w-5xl">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="h-4 bg-border rounded w-3/4 mb-3" />
          <div className="h-3 bg-border rounded w-1/2 mb-1" />
          <div className="h-2 bg-border rounded w-1/3 mt-3" />
        </div>
      ))}
    </div>
  )
}
