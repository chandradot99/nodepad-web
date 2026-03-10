import client from './client'
import type { Connection, Credential } from '../types'

export const connectionsApi = {
  list: (workspaceId: string) =>
    client.get<Connection[]>(`/workspaces/${workspaceId}/connections`).then(r => r.data),

  create: (workspaceId: string, data: { name: string; base_url: string; api_key: string }) =>
    client.post<Connection>(`/workspaces/${workspaceId}/connections`, data).then(r => r.data),

  test: (id: string) =>
    client.get<{ success: boolean; message?: string; error?: string }>(`/connections/${id}/test`).then(r => r.data),

  credentials: (id: string) =>
    client.get<Credential[]>(`/connections/${id}/credentials`).then(r => r.data),

  delete: (id: string) => client.delete(`/connections/${id}`),
}
