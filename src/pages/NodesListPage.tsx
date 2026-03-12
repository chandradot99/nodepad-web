import { useEffect, useMemo, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { useWorkspaceStore } from '../store/workspace'
import { nodesApi, type NodeSummary } from '../api/nodes'

function categoryColor(category: string): string {
  const map: Record<string, string> = {
    'AI':          'bg-violet-500/15 text-violet-400',
    'Trigger':     'bg-green-500/15 text-green-400',
    'Action':      'bg-blue-500/15 text-blue-400',
    'Transform':   'bg-amber-500/15 text-amber-400',
    'Flow':        'bg-cyan-500/15 text-cyan-400',
    'Output':      'bg-orange-500/15 text-orange-400',
  }
  return map[category] ?? 'bg-surface-raised text-text-muted'
}

function resolveIconUrl(iconUrl: string | null, baseUrl: string): string | null {
  if (!iconUrl) return null
  if (iconUrl.startsWith('http')) return iconUrl
  return `${baseUrl.replace(/\/$/, '')}/${iconUrl.replace(/^\//, '')}`
}

function NodeIcon({ node, baseUrl }: { node: NodeSummary; baseUrl: string }) {
  const src = resolveIconUrl(node.icon_url, baseUrl)

  if (src) {
    return (
      <img
        src={src}
        alt={node.display_name}
        className="w-5 h-5 object-contain"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }

  return (
    <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-text-muted">
      {(node.display_name || node.name)[0]?.toUpperCase()}
    </span>
  )
}

function NodeCard({ node, baseUrl }: { node: NodeSummary; baseUrl: string }) {
  const category = node.codex?.categories?.[0] ?? node.group?.[0] ?? ''

  return (
    <div className="card p-3.5 flex items-start gap-3 hover:border-border-strong transition-colors cursor-default">
      <div className="w-8 h-8 rounded bg-surface-raised flex items-center justify-center shrink-0">
        <NodeIcon node={node} baseUrl={baseUrl} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text truncate">{node.display_name}</p>
        {node.description && (
          <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2 leading-relaxed">{node.description}</p>
        )}
        {category && (
          <span className={`inline-block mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${categoryColor(category)}`}>
            {category}
          </span>
        )}
      </div>
    </div>
  )
}

export default function NodesListPage() {
  const { currentId, workspaces, currentConnection } = useWorkspaceStore()
  const [nodes, setNodes] = useState<NodeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')

  useEffect(() => {
    if (!currentConnection) { setLoading(false); return }
    setLoading(true)
    setError('')

    nodesApi.list(currentConnection.id)
      .then((data) => setNodes(data))
      .catch(() => setError('Failed to load nodes.'))
      .finally(() => setLoading(false))
  }, [currentConnection])

  // Build category list from nodes
  const categories = useMemo(() => {
    const cats = new Set<string>()
    nodes.forEach((n) => {
      const cat = n.codex?.categories?.[0] ?? n.group?.[0]
      if (cat) cats.add(cat)
    })
    return ['All', ...Array.from(cats).sort()]
  }, [nodes])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return nodes.filter((n) => {
      const matchesSearch = !q ||
        n.display_name.toLowerCase().includes(q) ||
        n.name.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q) ||
        n.codex?.alias?.some((a) => a.toLowerCase().includes(q))

      const matchesCategory = activeCategory === 'All' ||
        n.codex?.categories?.[0] === activeCategory ||
        n.group?.[0] === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [nodes, search, activeCategory])

  const workspace = workspaces.find((w) => w.id === currentId)

  return (
    <AppLayout>
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-text">Nodes</h1>
            {!loading && nodes.length > 0 && (
              <p className="text-[11px] text-text-muted mt-0.5">{nodes.length} nodes synced · {workspace?.name}</p>
            )}
          </div>
        </div>

        {/* Search */}
        {nodes.length > 0 && (
          <div className="mt-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search nodes…"
              className="input w-full max-w-sm px-3 py-1.5 text-sm"
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Category sidebar */}
        {categories.length > 1 && (
          <div className="w-44 border-r border-border shrink-0 overflow-y-auto py-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full text-left px-4 py-1.5 text-xs transition-colors ${
                  activeCategory === cat
                    ? 'text-accent font-medium bg-accent/10'
                    : 'text-text-muted hover:text-text hover:bg-surface-raised'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Node grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <p className="text-sm text-text-muted">Loading nodes…</p>
          )}

          {!loading && error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {!loading && !error && nodes.length === 0 && (
            <div className="text-center py-16">
              <p className="text-3xl mb-3 opacity-20">⬡</p>
              <p className="text-sm font-semibold text-text mb-1">No nodes synced yet</p>
              <p className="text-xs text-text-muted">
                Install the NodePad Chrome extension and sync your n8n instance from <br />
                <span className="text-accent">Settings → Extension</span>.
              </p>
            </div>
          )}

          {!loading && !error && nodes.length > 0 && filtered.length === 0 && (
            <p className="text-sm text-text-muted">No nodes match "{search}".</p>
          )}

          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
              {filtered.map((node) => (
                <NodeCard key={node.id} node={node} baseUrl={currentConnection?.base_url ?? ''} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
