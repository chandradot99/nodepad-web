import client from './client'
import type { Workspace } from '../types'

export const workspacesApi = {
  list: () => client.get<Workspace[]>('/workspaces').then(r => r.data),
  create: (name: string) => client.post<Workspace>('/workspaces', { name }).then(r => r.data),
  delete: (id: string) => client.delete(`/workspaces/${id}`),
}
