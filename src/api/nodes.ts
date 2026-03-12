import client from './client'

export interface NodeSummary {
  id: string
  name: string
  display_name: string
  group: string[]
  description: string | null
  icon_url: string | null
  version: number | null
  codex: {
    categories?: string[]
    subcategories?: Record<string, string[]>
    alias?: string[]
  } | null
}

export const nodesApi = {
  list: (connectionId: string) =>
    client.get<NodeSummary[]>(`/connections/${connectionId}/nodes`).then(r => r.data),
}
