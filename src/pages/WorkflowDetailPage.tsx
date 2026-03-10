import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactFlow, {
  Node, Edge, Background, Controls,
  useNodesState, useEdgesState, Handle, Position
} from 'reactflow'
import 'reactflow/dist/style.css'
import AppLayout from '../components/layout/AppLayout'
import { workflowsApi } from '../api/workflows'
import client from '../api/client'
import type { Workflow, Message } from '../types'

// ─── n8n → React Flow conversion ────────────────────────────────────────────

function n8nToFlow(data: Record<string, unknown>) {
  const rawNodes = (data.nodes as any[]) || []
  const rawConns = (data.connections as Record<string, any>) || {}

  const nodes: Node[] = rawNodes.map((n: any) => ({
    id: n.id,
    position: { x: n.position[0], y: n.position[1] },
    data: { label: n.name, nodeType: n.type },
    type: 'n8nNode',
  }))

  const nameToId: Record<string, string> = {}
  rawNodes.forEach((n: any) => { nameToId[n.name] = n.id })

  const edges: Edge[] = []
  for (const [sourceName, outputs] of Object.entries(rawConns)) {
    const sourceId = nameToId[sourceName]
    if (!sourceId) continue
    for (const outputGroup of (outputs as any).main || []) {
      for (const conn of outputGroup || []) {
        const targetId = nameToId[conn.node]
        if (targetId) {
          edges.push({
            id: `${sourceId}-${targetId}`,
            source: sourceId,
            target: targetId,
            animated: true,
            style: { stroke: '#6b7280' },
          })
        }
      }
    }
  }

  return { nodes, edges }
}

// ─── Custom n8n node ─────────────────────────────────────────────────────────

function N8nNode({ data }: { data: { label: string; nodeType: string } }) {
  const shortType = data.nodeType?.split('.').pop() ?? 'node'
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 min-w-[150px] shadow-lg">
      <Handle type="target" position={Position.Left} className="!bg-gray-500" />
      <div className="text-xs text-gray-400 mb-0.5 truncate">{shortType}</div>
      <div className="text-sm font-semibold text-white truncate">{data.label}</div>
      <Handle type="source" position={Position.Right} className="!bg-gray-500" />
    </div>
  )
}

const nodeTypes = { n8nNode: N8nNode }

// ─── Chat panel ──────────────────────────────────────────────────────────────

function ChatPanel({ workflowId }: { workflowId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('claude_api_key') || '')
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem('claude_api_key'))
  const [sending, setSending] = useState(false)

  // Create or load conversation on mount
  useEffect(() => {
    client.post(`/workflows/${workflowId}/conversations`, { title: 'Chat' })
      .then(r => {
        setConversationId(r.data.id)
        // Load existing messages if any
        return client.get(`/conversations/${r.data.id}/messages`).catch(() => ({ data: [] }))
      })
      .then(r => setMessages(r.data || []))
      .catch(() => {})
  }, [workflowId])

  const saveApiKey = () => {
    localStorage.setItem('claude_api_key', apiKey)
    setShowKeyInput(false)
  }

  const send = useCallback(async () => {
    if (!input.trim() || !conversationId || !apiKey || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content, conversation_id: conversationId, inserted_at: '' }])

    try {
      const { data } = await client.post(`/conversations/${conversationId}/messages`, {
        content,
        claude_api_key: apiKey,
      })
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply, conversation_id: conversationId, inserted_at: '' }])
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Error: Failed to get response.', conversation_id: conversationId, inserted_at: '' }])
    } finally {
      setSending(false)
    }
  }, [input, conversationId, apiKey, sending])

  return (
    <div className="flex flex-col h-full bg-gray-950 border-l border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold">AI Assistant</h2>
        <button
          onClick={() => setShowKeyInput(v => !v)}
          className="text-xs text-gray-400 hover:text-white"
        >
          {showKeyInput ? 'Cancel' : '🔑 API Key'}
        </button>
      </div>

      {/* API key input */}
      {showKeyInput && (
        <div className="px-4 py-3 border-b border-gray-800 bg-gray-900 space-y-2">
          <p className="text-xs text-gray-400">Enter your Claude API key (stored locally)</p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
            />
            <button
              onClick={saveApiKey}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm text-center mt-8">
            Ask me to modify this workflow.<br />
            <span className="text-xs">e.g. "Add a Slack notification node"</span>
          </p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-400">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-800">
        {!apiKey && !showKeyInput && (
          <p className="text-xs text-yellow-500 mb-2">Set your Claude API key to start chatting</p>
        )}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask to modify this workflow..."
            rows={2}
            disabled={!apiKey}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-gray-500 disabled:opacity-40"
          />
          <button
            onClick={send}
            disabled={!input.trim() || !apiKey || sending}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed self-end"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [fetching, setFetching] = useState(true)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    if (!id) return
    workflowsApi.get(id)
      .then(wf => {
        setWorkflow(wf)
        const { nodes: n, edges: e } = n8nToFlow(wf.data)
        setNodes(n)
        setEdges(e)
      })
      .catch(() => navigate(-1))
      .finally(() => setFetching(false))
  }, [id])

  if (fetching) {
    return <AppLayout><p className="text-gray-400 p-6">Loading workflow...</p></AppLayout>
  }

  return (
    <AppLayout noPadding>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-950">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-sm">← Back</button>
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold">{workflow?.name}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${workflow?.active ? 'bg-green-900 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
            {workflow?.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <p className="text-gray-500 text-xs ml-auto">ID: {workflow?.n8n_workflow_id}</p>
      </div>

      {/* Split layout */}
      <div className="flex h-[calc(100vh-105px)]">
        {/* Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-950"
          >
            <Background color="#374151" gap={20} />
            <Controls className="[&>button]:bg-gray-800 [&>button]:border-gray-700 [&>button]:text-white" />
          </ReactFlow>
        </div>

        {/* Chat panel */}
        <div className="w-[360px] flex-shrink-0">
          {id && <ChatPanel workflowId={id} />}
        </div>
      </div>
    </AppLayout>
  )
}
