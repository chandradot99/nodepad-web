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
    workflowsApi.get(id)
      .then(wf => {
        setWorkflow(wf)
        const { nodes: n, edges: e } = n8nToFlow(wf.data)
        setNodes(n)
        setEdges(e)
        // Fetch credentials for this connection (best-effort)
        return connectionsApi.credentials(wf.connection_id).catch(() => [])
      })
      .then(creds => setCredentials(creds))
      .catch(() => navigate(-1))
      .finally(() => setFetching(false))
  }, [id])

  if (fetching) {
    return <AppLayout><p className="text-gray-400">Loading workflow...</p></AppLayout>
  }

  return (
    <AppLayout noPadding>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-950 shrink-0">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Back
        </button>
        <div className="w-px h-4 bg-gray-700" />
        <h1 className="text-sm font-semibold">{workflow?.name}</h1>
        <span className={`text-xs px-2 py-0.5 rounded-full ${workflow?.active ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
          {workflow?.active ? 'Active' : 'Inactive'}
        </span>
        <span className="text-gray-600 text-xs ml-auto">n8n ID: {workflow?.n8n_workflow_id}</span>
      </div>

      {/* Split layout */}
      <div className="flex" style={{ height: 'calc(100vh - 105px)' }}>
        <div className="flex-1 min-w-0">
          <WorkflowCanvas initialNodes={nodes} initialEdges={edges} />
        </div>
        <div className="w-[360px] shrink-0">
          {id && <ChatPanel workflowId={id} credentials={credentials} />}
        </div>
      </div>
    </AppLayout>
  )
}
