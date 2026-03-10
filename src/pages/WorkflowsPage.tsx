import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Button from '../components/ui/Button'
import { workflowsApi } from '../api/workflows'
import type { Workflow } from '../types'

export default function WorkflowsPage() {
  const { connectionId } = useParams<{ connectionId: string }>()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!connectionId) return
    workflowsApi.list(connectionId)
      .then(setWorkflows)
      .catch(() => setError('Failed to fetch workflows. Check your connection.'))
      .finally(() => setFetching(false))
  }, [connectionId])

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-sm">← Back</button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Workflows</h1>
            <p className="text-gray-400 text-sm mt-1">Synced from your n8n instance</p>
          </div>
          <Button variant="secondary" onClick={() => workflowsApi.list(connectionId!).then(setWorkflows)}>
            ↻ Sync
          </Button>
        </div>

        {fetching ? (
          <p className="text-gray-400">Syncing workflows from n8n...</p>
        ) : error ? (
          <div className="border border-red-800 bg-red-950 rounded-xl p-6 text-red-400">{error}</div>
        ) : workflows.length === 0 ? (
          <div className="border border-dashed border-gray-700 rounded-xl p-12 text-center">
            <p className="text-gray-400">No workflows found in this n8n instance</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workflows.map(wf => (
              <div
                key={wf.id}
                onClick={() => navigate(`/workflows/${wf.id}`)}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 cursor-pointer hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-white">{wf.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${wf.active ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                        {wf.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">ID: {wf.n8n_workflow_id}</p>
                  </div>
                  <span className="text-gray-600 text-sm">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
