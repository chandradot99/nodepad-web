import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import { useWorkspaceStore } from '../store/workspace'
import { useTheme } from '../context/ThemeContext'
import { connectionsApi } from '../api/connections'
import type { SavedCredential } from '../types'


const TYPE_LABELS: Record<string, string> = {
  googleSheetsOAuth2Api: 'Google Sheets',
  googleDriveOAuth2Api: 'Google Drive',
  slackOAuth2Api: 'Slack',
  githubOAuth2Api: 'GitHub',
  notionApi: 'Notion',
  airtableTokenApi: 'Airtable',
  openAiApi: 'OpenAI',
  anthropicApi: 'Anthropic',
  postgresDb: 'PostgreSQL',
  mysqlDb: 'MySQL',
  httpHeaderAuth: 'Header Auth',
  httpBasicAuth: 'Basic Auth',
}

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type
}

function typeColor(type: string): string {
  if (type.toLowerCase().includes('google')) return 'bg-blue-500/10 text-blue-400'
  if (type.toLowerCase().includes('oauth')) return 'bg-purple-500/10 text-purple-400'
  if (type.toLowerCase().includes('api')) return 'bg-amber-500/10 text-amber-400'
  if (type.toLowerCase().includes('db') || type.toLowerCase().includes('postgres') || type.toLowerCase().includes('mysql')) return 'bg-green-500/10 text-green-400'
  return 'bg-surface-raised text-text-muted'
}

function ExtensionBanner() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 flex gap-3">
      <div className="text-amber-400 text-base shrink-0 mt-0.5">⚠</div>
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-text">Sync credentials via the Chrome extension</p>
        <p className="text-xs text-text-muted leading-relaxed">
          The n8n API doesn't reliably expose credentials — sync them using the NodePad Chrome extension
          from your n8n instance instead.{' '}
          <strong className="text-text font-medium">We never store credential values</strong> — only the
          name and type are saved so the AI can reference them in workflows.
        </p>
        <Link
          to="/settings?tab=extension"
          className="inline-block mt-1 text-xs font-medium text-accent hover:underline"
        >
          Set up the extension →
        </Link>
      </div>
    </div>
  )
}

function resolveIconUrl(iconUrl: string | null, baseUrl: string): string | null {
  if (!iconUrl) return null
  if (iconUrl.startsWith('http')) return iconUrl
  return `${baseUrl.replace(/\/$/, '')}/${iconUrl.replace(/^\//, '')}`
}

function CredentialIcon({ cred, baseUrl }: { cred: SavedCredential; baseUrl: string }) {
  const { theme } = useTheme()
  const raw = theme === 'dark' ? (cred.icon_url_dark ?? cred.icon_url_light) : (cred.icon_url_light ?? cred.icon_url_dark)
  const src = resolveIconUrl(raw, baseUrl)

  if (src) {
    return (
      <img
        src={src}
        alt={cred.type}
        className="w-5 h-5 object-contain"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  return <span className="text-xs font-bold text-text-muted">{(cred.name || cred.type)[0]?.toUpperCase()}</span>
}

function CredentialRow({ cred, baseUrl }: { cred: SavedCredential; baseUrl: string }) {
  return (
    <div className="card px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded bg-surface-raised flex items-center justify-center shrink-0">
        <CredentialIcon cred={cred} baseUrl={baseUrl} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">{cred.name || '(unnamed)'}</p>
        <p className="text-[11px] text-text-muted font-mono truncate">{cred.n8n_id}</p>
      </div>
      <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${typeColor(cred.type)}`}>
        {typeLabel(cred.type)}
      </span>
    </div>
  )
}

export default function CredentialsPage() {
  const { workspaces, currentId, currentConnection } = useWorkspaceStore()
  const [creds, setCreds] = useState<SavedCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentConnection) { setLoading(false); return }
    setLoading(true)
    setError('')

    connectionsApi.savedCredentials(currentConnection.id)
      .then((data) => setCreds(data))
      .catch(() => setError('Failed to load credentials.'))
      .finally(() => setLoading(false))
  }, [currentConnection])

  const workspace = workspaces.find((w) => w.id === currentId)

  return (
    <AppLayout>
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-4 shrink-0">
        <h1 className="text-sm font-semibold text-text">Credentials</h1>
        {!loading && creds.length > 0 && (
          <p className="text-[11px] text-text-muted mt-0.5">
            {creds.length} credential{creds.length !== 1 ? 's' : ''} · {workspace?.name}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl space-y-4">

          <ExtensionBanner />

          {loading && <p className="text-sm text-text-muted">Loading…</p>}

          {!loading && error && <p className="text-sm text-red-400">{error}</p>}

          {!loading && !error && creds.length === 0 && (
            <div className="text-center py-12">
              <p className="text-3xl mb-3 opacity-20">🔑</p>
              <p className="text-sm font-semibold text-text mb-1">No credentials synced yet</p>
              <p className="text-xs text-text-muted">
                Use the NodePad Chrome extension to sync credentials from your n8n instance.
              </p>
            </div>
          )}

          {!loading && !error && creds.length > 0 && (
            <div className="space-y-2">
              {creds.map((cred) => (
                <CredentialRow key={cred.id} cred={cred} baseUrl={currentConnection?.base_url ?? ''} />
              ))}
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  )
}
