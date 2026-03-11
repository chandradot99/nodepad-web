import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import WorkflowCanvas from '../components/workflow/WorkflowCanvas'
import ChatPanel from '../components/chat/ChatPanel'
import { workflowsApi } from '../api/workflows'
import { connectionsApi } from '../api/connections'
import { n8nToFlow } from '../utils/n8nToFlow'
import type { Workflow, Credential } from '../types'
import type { Node, Edge } from 'reactflow'

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!id) return
    setFetching(true)
    workflowsApi.get(id)
      .then((wf) => {
        setWorkflow(wf)
        const { nodes: n, edges: e } = n8nToFlow(wf.data)
        setNodes(n)
        setEdges(e)
        return connectionsApi.credentials(wf.connection_id).catch(() => [])
      })
      .then(setCredentials)
      .catch(() => navigate(-1))
      .finally(() => setFetching(false))
  }, [id])

  if (fetching) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted text-sm">Loading workflow...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      {/* Workflow top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-surface shrink-0">
        <button
          onClick={() => navigate('/workflows')}
          className="text-text-muted hover:text-text text-xs transition-colors shrink-0"
        >
          ← Workflows
        </button>
        <div className="w-px h-4 bg-border shrink-0" />
        <h1 className="text-sm font-semibold text-text truncate">{workflow?.name}</h1>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
          workflow?.active
            ? 'bg-green-500/15 text-green-400'
            : 'bg-surface-raised text-text-muted'
        }`}>
          {workflow?.active ? 'Active' : 'Inactive'}
        </span>
        <span className="text-text-muted text-[10px] font-mono ml-auto shrink-0">
          {workflow?.n8n_workflow_id}
        </span>
      </div>

      {/* Canvas + Chat — fills remaining height */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 [color-scheme:dark]">
          <WorkflowCanvas initialNodes={nodes} initialEdges={edges} />
        </div>
        <div className="w-[360px] shrink-0">
          {id && <ChatPanel workflowId={id} credentials={credentials} />}
        </div>
      </div>
    </AppLayout>
  )
}
