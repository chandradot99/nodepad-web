export interface User {
  id: string
  name: string
  email: string
}

export interface Workspace {
  id: string
  name: string
  user_id: string
  inserted_at: string
}

export interface Connection {
  id: string
  name: string
  base_url: string
  workspace_id: string
  inserted_at: string
}

export interface Workflow {
  id: string
  n8n_workflow_id: string
  name: string
  active: boolean
  data: Record<string, unknown>
  connection_id: string
  inserted_at: string
}

export interface Draft {
  id: string
  data: Record<string, unknown>
  status: 'pending' | 'pushed'
  workflow_id: string
  user_id: string
  inserted_at: string
}

export interface Conversation {
  id: string
  title: string | null
  workflow_id: string
  user_id: string
  inserted_at: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  conversation_id: string
  inserted_at: string
}
