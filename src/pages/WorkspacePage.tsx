import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { connectionsApi } from '../api/connections'
import type { Connection } from '../types'

export default function WorkspacePage() {
  const { id: workspaceId } = useParams<{ id: string }>()
  const [connections, setConnections] = useState<Connection[]>([])
  const [showModal, setShowModal] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null)
  const [form, setForm] = useState({ name: '', base_url: '', api_key: '' })
  const navigate = useNavigate()

  useEffect(() => {
    if (!workspaceId) return
    connectionsApi.list(workspaceId)
      .then(setConnections)
      .finally(() => setFetching(false))
  }, [workspaceId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const conn = await connectionsApi.create(workspaceId!, form)
      setConnections(prev => [...prev, conn])
      setShowModal(false)
      setForm({ name: '', base_url: '', api_key: '' })
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async (id: string) => {
    setTesting(id)
    setTestResult(null)
    try {
      const result = await connectionsApi.test(id)
      setTestResult({ id, success: result.success, message: result.message || result.error || '' })
    } catch {
      setTestResult({ id, success: false, message: 'Connection failed' })
    } finally {
      setTesting(null)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white text-sm">← Workspaces</button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">n8n Connections</h1>
            <p className="text-gray-400 text-sm mt-1">Connect your n8n instances to this workspace</p>
          </div>
          <Button onClick={() => setShowModal(true)}>+ Add Connection</Button>
        </div>

        {fetching ? (
          <p className="text-gray-400">Loading...</p>
        ) : connections.length === 0 ? (
          <div className="border border-dashed border-gray-700 rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-4">No connections yet</p>
            <Button onClick={() => setShowModal(true)}>Connect your n8n instance</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map(conn => (
              <div key={conn.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{conn.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{conn.base_url}</p>
                    {testResult?.id === conn.id && (
                      <p className={`text-xs mt-1 ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                        {testResult.success ? '✓ Connected' : `✗ ${testResult.message}`}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      loading={testing === conn.id}
                      onClick={() => handleTest(conn.id)}
                    >
                      Test
                    </Button>
                    <Button onClick={() => navigate(`/connections/${conn.id}/workflows`)}>
                      View Workflows
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Add n8n Connection" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Connection name"
              placeholder="e.g. Production n8n"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
            />
            <Input
              label="n8n URL"
              placeholder="https://n8n.yourcompany.com"
              value={form.base_url}
              onChange={e => setForm(p => ({ ...p, base_url: e.target.value }))}
              required
            />
            <Input
              label="API Key"
              type="password"
              placeholder="Your n8n API key"
              value={form.api_key}
              onChange={e => setForm(p => ({ ...p, api_key: e.target.value }))}
              required
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" loading={loading}>Add Connection</Button>
            </div>
          </form>
        </Modal>
      )}
    </AppLayout>
  )
}
